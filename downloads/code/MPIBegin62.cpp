#define _CRT_SECURE_NO_WARNINGS
#include <cstdio>
#include <vector>
#include <windows.h>

struct IntRealInt { int first; double second; int third; };

// MPIBegin62 без MPI: тройка int-double-int каждому подчинённому процессу.
int main()
{
    SetConsoleOutputCP(CP_UTF8);
    int k;
    printf("Введите количество процессов K (2..12): ");
    if (scanf("%d", &k) != 1 || k < 2 || k > 12) return 0;

    std::vector<IntRealInt> data(k);
    for (int rank = 1; rank < k; ++rank)
    {
        printf("Для процесса %d введите int double int: ", rank);
        if (scanf("%d%lf%d", &data[rank].first,
                  &data[rank].second, &data[rank].third) != 3) return 0;
    }

    printf("\nРезультат:\n");
    for (int rank = 1; rank < k; ++rank)
        printf("Процесс %d получил: %d %.2f %d\n",
               rank, data[rank].first, data[rank].second, data[rank].third);
    return 0;
}
