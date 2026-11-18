#define _CRT_SECURE_NO_WARNINGS
#include <cstdio>
#include <vector>
#include <windows.h>

// MPIBegin18 без MPI: циклический сдвиг данных с шагом +1.
int main()
{
    SetConsoleOutputCP(CP_UTF8);

    int processCount;
    printf("Введите количество процессов K (2..12): ");
    if (scanf("%d", &processCount) != 1 || processCount < 2 || processCount > 12)
        return 0;

    std::vector<int> sent(processCount), received(processCount);
    for (int rank = 0; rank < processCount; ++rank)
    {
        printf("Процесс %d: введите целое число: ", rank);
        if (scanf("%d", &sent[rank]) != 1) return 0;
    }

    for (int rank = 0; rank < processCount; ++rank)
        received[(rank + 1) % processCount] = sent[rank];

    printf("\nРезультат циклического сдвига:\n");
    for (int rank = 0; rank < processCount; ++rank)
        printf("Процесс %d получил %d\n", rank, received[rank]);
    return 0;
}
