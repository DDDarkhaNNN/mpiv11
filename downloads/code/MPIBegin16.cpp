#define _CRT_SECURE_NO_WARNINGS
#include <cstdio>
#include <vector>
#include <windows.h>

// MPIBegin16 без MPI: суммируются положительные N подчинённых процессов.
int main()
{
    SetConsoleOutputCP(CP_UTF8);

    int processCount;
    printf("Введите количество процессов P (2..12): ");
    if (scanf("%d", &processCount) != 1 || processCount < 2 || processCount > 12)
        return 0;

    int k;
    printf("Главный процесс: введите K - количество положительных N: ");
    if (scanf("%d", &k) != 1 || k < 1 || k >= processCount) return 0;

    std::vector<int> n(processCount);
    int positiveCount = 0;
    int sum = 0;
    for (int rank = 1; rank < processCount; ++rank)
    {
        printf("Процесс %d: введите N: ", rank);
        if (scanf("%d", &n[rank]) != 1) return 0;
        if (n[rank] > 0)
        {
            ++positiveCount;
            sum += n[rank];
        }
    }

    if (positiveCount != k)
    {
        printf("Ошибка: введено положительных N: %d, а K = %d.\n", positiveCount, k);
        return 0;
    }

    printf("\nСумма положительных N = %d\n", sum);
    return 0;
}
