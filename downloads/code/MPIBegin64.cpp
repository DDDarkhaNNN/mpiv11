#define _CRT_SECURE_NO_WARNINGS
#include <cstdio>
#include <vector>
#include <windows.h>

struct IntRealInt { int first; double second; int third; };

// MPIBegin64 без MPI: все тройки становятся доступны каждому процессу.
int main()
{
    SetConsoleOutputCP(CP_UTF8);
    int k;
    printf("Введите количество процессов K (2..12): ");
    if (scanf("%d", &k) != 1 || k < 2 || k > 12) return 0;

    std::vector<IntRealInt> data(k);
    for (int rank = 0; rank < k; ++rank)
    {
        printf("Процесс %d: введите int double int: ", rank);
        if (scanf("%d%lf%d", &data[rank].first,
                  &data[rank].second, &data[rank].third) != 3) return 0;
    }

    printf("\nРезультат MPI_Allgather:\n");
    for (int receiver = 0; receiver < k; ++receiver)
    {
        printf("Процесс %d получил:\n", receiver);
        for (int source = 0; source < k; ++source)
            printf("  от %d: %d %.2f %d\n", source, data[source].first,
                   data[source].second, data[source].third);
    }
    return 0;
}
