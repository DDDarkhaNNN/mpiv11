#define _CRT_SECURE_NO_WARNINGS
#include <cstdio>
#include <vector>
#include <windows.h>

struct IntRealInt { int first; double second; int third; };

// MPIBegin67 без MPI: упаковка моделируется передачей одной тройки процессу.
int main()
{
    SetConsoleOutputCP(CP_UTF8);
    int k;
    printf("Введите количество процессов K (2..12): ");
    if (scanf("%d", &k) != 1 || k < 2 || k > 12) return 0;

    std::vector<IntRealInt> packed(k);
    for (int rank = 1; rank < k; ++rank)
    {
        printf("Тройка для процесса %d (int double int): ", rank);
        if (scanf("%d%lf%d", &packed[rank].first,
                  &packed[rank].second, &packed[rank].third) != 3) return 0;
    }

    printf("\nРезультат распаковки:\n");
    for (int rank = 1; rank < k; ++rank)
        printf("Процесс %d получил: %d %.2f %d\n", rank,
               packed[rank].first, packed[rank].second, packed[rank].third);
    return 0;
}
