function bits = lc3_flush_bits(bits)
%LC3_FLUSH_BITS Flush and terminate bitstream writing.
%   BITS = LC3_FLUSH_BITS(BITS) flushes remaining plain bits from the
%   accumulator into the output buffer and terminates the arithmetic coder
%   state stored in BITS. This is a MATLAB translation of the C
%   implementation located in src/bits.c.
%
%   The BITS structure is expected to expose the following fields:
%       bits.accu   - structure with fields v, n and nover.
%       bits.ac     - structure describing the arithmetic coder state.
%       bits.buffer - structure with at least fields data, p_fw, p_bw and end.
%   Buffer pointers p_fw and p_bw are treated as zero-based byte offsets.
%
%   Helper routine LC3_PUT_BITS must behave analogously to its C counterpart
%   by returning an updated bitstream structure.

    nleft = double(bits.buffer.p_bw) - double(bits.buffer.p_fw);
    n = 8 * nleft - double(bits.accu.n);

    while n > 0
        chunk = min(n, 32);
        bits = lc3_put_bits(bits, 0, chunk);
        n = n - 32;
    end

    [bits.accu, bits.buffer] = accu_flush(bits.accu, bits.buffer);
    [bits.ac, bits.buffer] = ac_terminate(bits.ac, bits.buffer);
end

function [ac, buffer] = ac_terminate(ac, buffer)
%AC_TERMINATE Arithmetic coder termination translated from C.
    nbits = 25 - ac_get_range_bits(ac);
    mask = bitshift(uint32(hex2dec('FFFFFF')), -nbits);
    low = uint32(ac.low);
    range = uint32(ac.range);

    val = low + mask;
    high = low + range;

    over_val = bitshift(val, -24) ~= 0;
    over_high = bitshift(high, -24) ~= 0;

    val = bitand(val, uint32(hex2dec('FFFFFF')));
    val = bitand(val, bitcmp(mask, 'uint32'));
    high = bitand(high, uint32(hex2dec('FFFFFF')));

    if over_val == over_high
        if uint32(val + mask) >= high
            nbits = nbits + 1;
            mask = bitshift(mask, -1);
            val = low + mask;
            val = bitand(val, uint32(hex2dec('FFFFFF')));
            val = bitand(val, bitcmp(mask, 'uint32'));
        end

        ac.carry = double((ac.carry ~= 0) || (val < low));
    end

    ac.low = val;

    while nbits > 8
        [ac, buffer] = ac_shift(ac, buffer);
        nbits = nbits - 8;
    end
    [ac, buffer] = ac_shift(ac, buffer);

    cache = int32(ac.cache);
    end_val = bitand(bitshift(cache, -(8 - nbits)), int32(255));
    end_val = uint32(end_val);

    if ac.carry_count > 0
        buffer = ac_put(buffer, cache);
        while ac.carry_count > 1
            buffer = ac_put(buffer, hex2dec('FF'));
            ac.carry_count = ac.carry_count - 1;
        end

        if nbits < 8
            end_val = uint32(0);
        else
            end_val = uint32(hex2dec('FF'));
        end
    end

    if buffer.p_fw < buffer.end
        idx = buffer.p_fw + 1;
        current = uint32(buffer.data(idx));
        keep_mask = bitshift(uint32(hex2dec('FF')), -nbits);
        current = bitand(current, keep_mask);
        end_val = bitand(end_val, uint32(255));
        current = bitor(current, bitshift(end_val, 8 - nbits));
        buffer.data(idx) = uint8(current);
    end
end

function nbits = ac_get_range_bits(ac)
%AC_GET_RANGE_BITS Return 1 + floor(log2(range)).
    range = uint32(ac.range);
    nbits = 0;

    while range ~= 0
        range = bitshift(range, -1);
        nbits = nbits + 1;
    end
end

function [ac, buffer] = ac_shift(ac, buffer)
%AC_SHIFT Arithmetic coder range shift translated from C.
    low = uint32(ac.low);

    if low < uint32(hex2dec('FF0000')) || ac.carry ~= 0
        if ac.cache >= 0
            byte = int32(ac.cache) + (ac.carry ~= 0);
            buffer = ac_put(buffer, byte);
        end

        while ac.carry_count > 0
            if ac.carry ~= 0
                buffer = ac_put(buffer, 0x00);
            else
                buffer = ac_put(buffer, hex2dec('FF'));
            end
            ac.carry_count = ac.carry_count - 1;
        end

        ac.cache = bitshift(int32(low), -16);
        ac.carry = 0;
    else
        ac.carry_count = ac.carry_count + 1;
    end

    ac.low = bitand(bitshift(low, 8), uint32(hex2dec('FFFFFF')));
end

function buffer = ac_put(buffer, byte)
%AC_PUT Output a byte to the forward buffer pointer if space is available.
    if buffer.p_fw < buffer.end
        idx = buffer.p_fw + 1;
        buffer.data(idx) = uint8(bitand(int32(byte), 255));
        buffer.p_fw = buffer.p_fw + 1;
    end
end

function [accu, buffer] = accu_flush(accu, buffer)
%ACCU_FLUSH Flush accumulator bytes toward the backward buffer pointer.
    nbytes = min(bitshift(int32(accu.n), -3), max(int32(buffer.p_bw) - int32(buffer.p_fw), 0));

    accu.n = accu.n - 8 * nbytes;

    while nbytes > 0
        buffer.p_bw = buffer.p_bw - 1;
        byte = bitand(uint32(accu.v), uint32(255));
        buffer.data(buffer.p_bw + 1) = uint8(byte);
        accu.v = bitshift(uint32(accu.v), -8);
        nbytes = nbytes - 1;
    end

    if accu.n >= 8
        accu.n = 0;
    end
end
