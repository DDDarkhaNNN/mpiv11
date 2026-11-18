#define _CRT_SECURE_NO_WARNINGS
#include <cstdio>
#include <vector>
#include <windows.h>

// MPIBegin10 без MPI: процессы моделируются по их рангам.
int main()
{
    SetConsoleOutputCP(CP_UTF8);

    int processCount;
    printf("Введите количество процессов K (2..12): ");
    if (scanf("%d", &processCount) != 1 || processCount < 2 || processCount > 12)
        return 0;

    std::vector<std::vector<int>> data(processCount);
    for (int rank = 1; rank < processCount; ++rank)
    {
        int n;
        do
        {
            printf("Процесс %d: введите N (1..4): ", rank);
            if (scanf("%d", &n) != 1) return 0;
        } while (n < 1 || n > 4);

        data[rank].resize(n);
        printf("Процесс %d: введите %d целых чисел: ", rank, n);
        for (int& value : data[rank])
            if (scanf("%d", &value) != 1) return 0;
    }

    printf("\nРезультат в главном процессе:\n");
    for (int rank = 1; rank < processCount; ++rank)
    {
        printf("От процесса %d:", rank);
        for (int value : data[rank]) printf(" %d", value);
        printf("\n");
    }
    return 0;
}
