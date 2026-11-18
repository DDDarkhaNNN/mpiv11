#define _CRT_SECURE_NO_WARNINGS
#include <cstdio>
#include <vector>
#include <windows.h>

struct ProcessData
{
    int type = 0;
    std::vector<int> integers;
    std::vector<double> reals;
};

// MPIBegin29 без MPI: тип набора определяется значением T.
int main()
{
    SetConsoleOutputCP(CP_UTF8);

    int processCount;
    printf("Введите количество процессов K (2..12): ");
    if (scanf("%d", &processCount) != 1 || processCount < 2 || processCount > 12)
        return 0;

    std::vector<ProcessData> data(processCount);
    for (int rank = 1; rank < processCount; ++rank)
    {
        int n;
        printf("Процесс %d: введите T (0 - целые, 1 - вещественные) и N: ", rank);
        if (scanf("%d%d", &data[rank].type, &n) != 2 ||
            (data[rank].type != 0 && data[rank].type != 1) || n <= 0)
            return 0;

        printf("Введите %d чисел: ", n);
        if (data[rank].type == 0)
        {
            data[rank].integers.resize(n);
            for (int& value : data[rank].integers)
                if (scanf("%d", &value) != 1) return 0;
        }
        else
        {
            data[rank].reals.resize(n);
            for (double& value : data[rank].reals)
                if (scanf("%lf", &value) != 1) return 0;
        }
    }

    printf("\nРезультат в главном процессе:\n");
    for (int rank = 1; rank < processCount; ++rank)
    {
        printf("От процесса %d (T=%d):", rank, data[rank].type);
        if (data[rank].type == 0)
            for (int value : data[rank].integers) printf(" %d", value);
        else
            for (double value : data[rank].reals) printf(" %.2f", value);
        printf("\n");
    }
    return 0;
}
