#define _CRT_SECURE_NO_WARNINGS
#include <cstdio>
#include <windows.h>

// MPIBegin3.
// Чётный ранг: вводится целое число. Нечётный ранг: вводится вещественное число.
// Результат: удвоенное значение введённого числа.
int main()
{
    SetConsoleOutputCP(CP_UTF8);

    while (true)
    {
        int rank;
        printf("\nВведите ранг (0, 1, 2, ...; -1 = выход): ");
        if (scanf("%d", &rank) != 1 || rank < 0)
            break;

        if (rank % 2 == 0)
        {
            int n;
            printf("Ранг %d (чётный): введите целое число: ", rank);
            if (scanf("%d", &n) != 1) break;
            printf("[MPIBegin3][ранг %d] n = %d, 2*n = %d\n", rank, n, 2 * n);
        }
        else
        {
            double x;
            printf("Ранг %d (нечётный): введите вещественное число: ", rank);
            if (scanf("%lf", &x) != 1) break;
            printf("[MPIBegin3][ранг %d] x = %.2f, 2*x = %.2f\n", rank, x, 2 * x);
        }
    }
    return 0;
}