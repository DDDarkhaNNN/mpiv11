#define _CRT_SECURE_NO_WARNINGS
#include <algorithm>
#include <cstdio>
#include <vector>
#include <windows.h>

// MPIBegin26 без MPI: числа A упорядочиваются по номеру N.
int main()
{
    SetConsoleOutputCP(CP_UTF8);

    int processCount;
    printf("Введите количество процессов K (2..12): ");
    if (scanf("%d", &processCount) != 1 || processCount < 2 || processCount > 12)
        return 0;

    std::vector<double> a(processCount), ordered(processCount);
    std::vector<int> n(processCount), numbers;
    for (int rank = 1; rank < processCount; ++rank)
    {
        printf("Процесс %d: введите A и N: ", rank);
        if (scanf("%lf%d", &a[rank], &n[rank]) != 2) return 0;
        numbers.push_back(n[rank]);
    }

    std::sort(numbers.begin(), numbers.end());
    for (int i = 0; i < processCount - 1; ++i)
    {
        if (numbers[i] != i + 1)
        {
            printf("Ошибка: значения N должны содержать все числа от 1 до %d.\n",
                   processCount - 1);
            return 0;
        }
    }

    for (int rank = 1; rank < processCount; ++rank)
        ordered[n[rank]] = a[rank];

    printf("\nЧисла A в порядке возрастания N:");
    for (int number = 1; number < processCount; ++number)
        printf(" %.2f", ordered[number]);
    printf("\n");
    return 0;
}
