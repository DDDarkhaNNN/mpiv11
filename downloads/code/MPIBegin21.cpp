#define _CRT_SECURE_NO_WARNINGS
#include <algorithm>
#include <cstdio>
#include <vector>
#include <windows.h>

// MPIBegin21 без MPI: пересылка A в процесс с рангом N.
int main()
{
    SetConsoleOutputCP(CP_UTF8);

    int processCount;
    printf("Введите количество процессов K (2..12): ");
    if (scanf("%d", &processCount) != 1 || processCount < 2 || processCount > 12)
        return 0;

    std::vector<double> a(processCount), received(processCount);
    std::vector<int> n(processCount), source(processCount);
    for (int rank = 0; rank < processCount; ++rank)
    {
        printf("Процесс %d: введите A и N: ", rank);
        if (scanf("%lf%d", &a[rank], &n[rank]) != 2) return 0;
    }

    std::vector<int> sorted = n;
    std::sort(sorted.begin(), sorted.end());
    for (int i = 0; i < processCount; ++i)
    {
        if (sorted[i] != i)
        {
            printf("Ошибка: значения N должны содержать все числа от 0 до %d.\n",
                   processCount - 1);
            return 0;
        }
    }

    for (int rank = 0; rank < processCount; ++rank)
    {
        received[n[rank]] = a[rank];
        source[n[rank]] = rank;
    }

    printf("\nРезультат:\n");
    for (int rank = 0; rank < processCount; ++rank)
        printf("Процесс %d получил %.2f от процесса %d\n",
               rank, received[rank], source[rank]);
    return 0;
}
