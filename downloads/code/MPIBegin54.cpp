#define _CRT_SECURE_NO_WARNINGS
#include <algorithm>
#include <cstdio>
#include <limits>
#include <vector>
#include <windows.h>

// MPIBegin54 без MPI: максимумы и распределение по два значения процессу.
int main()
{
    SetConsoleOutputCP(CP_UTF8);
    int k;
    printf("Введите количество процессов K (2..12): ");
    if (scanf("%d", &k) != 1 || k < 2 || k > 12) return 0;

    const int count = 2 * k;
    std::vector<double> maxima(count, -std::numeric_limits<double>::infinity());
    for (int rank = 0; rank < k; ++rank)
    {
        printf("Процесс %d: введите %d чисел: ", rank, count);
        for (int i = 0; i < count; ++i)
        {
            double value;
            if (scanf("%lf", &value) != 1) return 0;
            maxima[i] = std::max(maxima[i], value);
        }
    }

    printf("\nРезультат MPI_Reduce_scatter:\n");
    for (int rank = 0; rank < k; ++rank)
        printf("Процесс %d получил: %.2f %.2f\n",
               rank, maxima[2 * rank], maxima[2 * rank + 1]);
    return 0;
}
