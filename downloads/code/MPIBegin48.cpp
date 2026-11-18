#define _CRT_SECURE_NO_WARNINGS
#include <cstdio>
#include <vector>
#include <windows.h>

// MPIBegin48 без MPI: поэлементная сумма наборов всех процессов.
int main()
{
    SetConsoleOutputCP(CP_UTF8);
    int k;
    printf("Введите количество процессов K (2..12): ");
    if (scanf("%d", &k) != 1 || k < 2 || k > 12) return 0;

    const int count = k + 5;
    std::vector<long long> sums(count, 0);
    for (int rank = 0; rank < k; ++rank)
    {
        printf("Процесс %d: введите %d целых чисел: ", rank, count);
        for (int i = 0; i < count; ++i)
        {
            int value;
            if (scanf("%d", &value) != 1) return 0;
            sums[i] += value;
        }
    }

    printf("\nСуммы в главном процессе:");
    for (long long value : sums) printf(" %lld", value);
    printf("\n");
    return 0;
}
