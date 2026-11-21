// MPIBegin16. Сумма положительных чисел в главном процессе.
#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int size, const Rows&) {
    if (rank != 0) return numbers(label(rank) + "одно целое число: ", 1, 1, true);
    for (;;) {
        Row row = numbers("Ранг 0 — сколько положительных чисел будет у остальных рангов? ", 1, 1, true);
        int expected = std::stoi(row[0]);
        if (expected >= 1 && expected < size) return row;
        std::cout << "Введите число от 1 до " << size - 1 << ".\n";
    }
}

bool consistent(const Rows& rows) {
    int positive = 0;
    for (size_t r = 1; r < rows.size(); ++r)
        if (std::stoi(rows[r].at(0)) > 0) ++positive;
    if (positive == std::stoi(rows[0].at(0))) return true;
    std::cout << "Число положительных значений не совпало с ожидаемым. Повторите опыт.\n";
    return false;
}

void solve(int rank, int, const Row& row) {
    MPI_Comm comm = MPI_COMM_WORLD;
    int n = std::stoi(row.at(0));
    if (rank == 0) {
        long long sum = 0;
        for (int i = 0; i < n; ++i) {
            int value;
            MPI_Status status;
            MPI_Recv(&value, 1, MPI_INT, MPI_ANY_SOURCE, 0, comm, &status);
            sum += value;
        }
        answer(0, std::to_string(sum));
    } else if (n > 0) {
        MPI_Send(&n, 1, MPI_INT, 0, 0, comm);
    }
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin16. Сумма положительных чисел в главном процессе.", InputRanks::all, 2, false, false, readInput, solve, consistent};
    return run(argc, argv, task);
}
