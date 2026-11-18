#define _CRT_SECURE_NO_WARNINGS
#include <cstdio>
#include <vector>
#include <windows.h>

// MPIBegin11 без MPI: главный процесс распределяет числа по рангам.
int main()
{
    SetConsoleOutputCP(CP_UTF8);

    int processCount;
    printf("Введите количество процессов K (2..12): ");
    if (scanf("%d", &processCount) != 1 || processCount < 2 || processCount > 12)
        return 0;

    std::vector<double> received(processCount);
    printf("Главный процесс: введите %d вещественных чисел:\n", processCount - 1);
    for (int rank = 1; rank < processCount; ++rank)
    {
        printf("Число для процесса %d: ", rank);
        if (scanf("%lf", &received[rank]) != 1) return 0;
    }

    printf("\nРезультат:\n");
    for (int rank = 1; rank < processCount; ++rank)
        printf("Процесс %d получил %.2f\n", rank, received[rank]);
    return 0;
}
