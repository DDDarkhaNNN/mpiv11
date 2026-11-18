#define _CRT_SECURE_NO_WARNINGS
#include <cstdio>
#include <vector>
#include <windows.h>

struct TwoIntReal { int first, second; double third; };

// MPIBegin69 без MPI: главный процесс получает упакованные тройки по рангам.
int main()
{
    SetConsoleOutputCP(CP_UTF8);
    int k;
    printf("Введите количество процессов K (2..12): ");
    if (scanf("%d", &k) != 1 || k < 2 || k > 12) return 0;

    std::vector<TwoIntReal> data(k);
    for (int rank = 1; rank < k; ++rank)
    {
        printf("Процесс %d: введите int int double: ", rank);
        if (scanf("%d%d%lf", &data[rank].first,
                  &data[rank].second, &data[rank].third) != 3) return 0;
    }

    printf("\nДанные в главном процессе:\n");
    for (int rank = 1; rank < k; ++rank)
        printf("От процесса %d: %d %d %.2f\n", rank,
               data[rank].first, data[rank].second, data[rank].third);
    return 0;
}
