#define _CRT_SECURE_NO_WARNINGS
#include <cstdio>
#include <vector>
#include <windows.h>

// MPIBegin24 без MPI: обмен наборами между парами 0-1, 2-3 и т. д.
int main()
{
    SetConsoleOutputCP(CP_UTF8);

    int processCount;
    printf("Введите чётное количество процессов K (2..12): ");
    if (scanf("%d", &processCount) != 1 || processCount < 2 ||
        processCount > 12 || processCount % 2 != 0)
        return 0;

    std::vector<std::vector<double>> data(processCount);
    for (int rank = 0; rank < processCount; ++rank)
    {
        int n;
        do
        {
            printf("Процесс %d: введите N (1..4): ", rank);
            if (scanf("%d", &n) != 1) return 0;
        } while (n < 1 || n > 4);

        data[rank].resize(n);
        printf("Введите %d чисел: ", n);
        for (double& value : data[rank])
            if (scanf("%lf", &value) != 1) return 0;
    }

    printf("\nРезультат обмена:\n");
    for (int rank = 0; rank < processCount; ++rank)
    {
        const int partner = rank % 2 == 0 ? rank + 1 : rank - 1;
        printf("Процесс %d получил от процесса %d:", rank, partner);
        for (double value : data[partner]) printf(" %.2f", value);
        printf("\n");
    }
    return 0;
}
