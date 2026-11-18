#define _CRT_SECURE_NO_WARNINGS
#include <cstdio>
#include <vector>
#include <windows.h>

struct TripleInt { int a, b, c; };

// MPIBegin59 без MPI: по одной тройке целых каждому подчинённому процессу.
int main()
{
    SetConsoleOutputCP(CP_UTF8);
    int k;
    printf("Введите количество процессов K (2..12): ");
    if (scanf("%d", &k) != 1 || k < 2 || k > 12) return 0;

    std::vector<TripleInt> data(k);
    for (int rank = 1; rank < k; ++rank)
    {
        printf("Тройка для процесса %d: ", rank);
        if (scanf("%d%d%d", &data[rank].a, &data[rank].b, &data[rank].c) != 3)
            return 0;
    }

    printf("\nРезультат:\n");
    for (int rank = 1; rank < k; ++rank)
        printf("Процесс %d получил: %d %d %d\n",
               rank, data[rank].a, data[rank].b, data[rank].c);
    return 0;
}
