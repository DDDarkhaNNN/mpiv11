#define _CRT_SECURE_NO_WARNINGS
#include <algorithm>
#include <cstdio>
#include <limits>
#include <vector>
#include <windows.h>

// MPIBegin57 без MPI: префиксные максимумы для процессов 0..R.
int main()
{
    SetConsoleOutputCP(CP_UTF8);
    int k;
    printf("Введите количество процессов K (2..12): ");
    if (scanf("%d", &k) != 1 || k < 2 || k > 12) return 0;

    const int count = k + 5;
    std::vector<int> prefixMax(count, std::numeric_limits<int>::min());
    printf("\nРезультаты MPI_Scan:\n");
    for (int rank = 0; rank < k; ++rank)
    {
        printf("Процесс %d: введите %d целых чисел: ", rank, count);
        for (int i = 0; i < count; ++i)
        {
            int value;
            if (scanf("%d", &value) != 1) return 0;
            prefixMax[i] = std::max(prefixMax[i], value);
        }

        printf("Процесс %d получил:", rank);
        for (int value : prefixMax) printf(" %d", value);
        printf("\n");
    }
    return 0;
}
