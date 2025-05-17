n = int(input())
for i in range(n, 100000):
    i = str(i)
    if int(i[0]) + int(i[1]) == int(i[3]) + int(i[4]) and int(i[2]) % 2 == 0:
        print(i)
        break
    
    