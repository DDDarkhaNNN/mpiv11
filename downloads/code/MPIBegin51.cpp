#define _CRT_SECURE_NO_WARNINGS
#include <cstdio>
#include <vector>
#include <windows.h>

// MPIBegin51 без MPI: поэлементное произведение наборов всех процессов.
int main()
{
    SetConsoleOutputCP(CP_UTF8);
    int k;
    printf("Введите количество процессов K (2..12): ");
    if (scanf("%d", &k) != 1 || k < 2 || k > 12) return 0;

    const int count = k + 5;
    std::vector<double> products(count, 1.0);
    for (int rank = 0; rank < k; ++rank)
    {
        printf("Процесс %d: введите %d чисел: ", rank, count);
        for (int i = 0; i < count; ++i)
        {
            double value;
            if (scanf("%lf", &value) != 1) return 0;
            products[i] *= value;
        }
    }

    printf("\nРезультат MPI_Allreduce (одинаков во всех процессах):\n");
    for (int rank = 0; rank < k; ++rank)
    {
        printf("Процесс %d:", rank);
        for (double value : products) printf(" %.2f", value);
        printf("\n");
    }
    return 0;
}
