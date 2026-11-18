#define _CRT_SECURE_NO_WARNINGS
#include <cstdio>
#include <windows.h>

// MPIBegin5.
// В каждом процессе дано целое N (> 0) и набор из N чисел.
// Чётный ранг: сумма. Нечётный ранг: среднее арифметическое.
int main()
{
    SetConsoleOutputCP(CP_UTF8);

    while (true)
    {
        int rank;
        printf("\nВведите ранг (0, 1, 2, ...; -1 = выход): ");
        if (scanf("%d", &rank) != 1 || rank < 0)
            break;

        int n;
        do
        {
            printf("Ранг %d: введите N (> 0): ", rank);
            if (scanf("%d", &n) != 1) return 0;
        } while (n <= 0);

        double s = 0, x;
        printf("Ранг %d: введите %d чисел: ", rank, n);
        for (int i = 0; i < n; i++)
        {
            if (scanf("%lf", &x) != 1) return 0;
            s += x;
        }

        if (rank % 2 == 0)
            printf("[MPIBegin5][ранг %d] N = %d, сумма = %.2f\n", rank, n, s);
        else
            printf("[MPIBegin5][ранг %d] N = %d, среднее = %.2f\n", rank, n, s / n);
    }
    return 0;
}