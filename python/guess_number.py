"""猜数字小游戏。

直接运行此文件即可开始游戏。
"""

import random


def main() -> None:
    """游戏主循环。"""
    number = random.randint(1, 100)
    print("我想了一个 1 到 100 之间的数字，猜猜看是什么？")

    while True:
        try:
            guess = int(input("请输入你的猜测："))
        except ValueError:
            print("请输入有效的整数！")
            continue

        if guess < number:
            print("太小了，再试试！")
        elif guess > number:
            print("太大了，再试试！")
        else:
            print("恭喜你猜对了！")
            break


if __name__ == "__main__":
    main()
