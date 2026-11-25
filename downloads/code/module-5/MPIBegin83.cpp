#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int, int size, const Rows&) {
    for (;;) {
        Row row = numbers("Ранг 0 — целое N (>1), делящее K=" + std::to_string(size) + ": ", 1, 1, true);
        const int n = std::stoi(row[0]);
        if (n > 1 && size % n == 0) return row;
        std::cout << "Ошибка: N должно быть больше 1 и делить K без остатка. Повторите строку.\n";
    }
}

void solve(int rank, int size, const Row& row) {
    int n = rank == 0 ? std::stoi(row.at(0)) : 0;
    MPI_Bcast(&n, 1, MPI_INT, 0, MPI_COMM_WORLD);
    int dims[2] = {n, size / n}, periods[2] = {0, 0};
    MPI_Comm cart;
    MPI_Cart_create(MPI_COMM_WORLD, 2, dims, periods, 0, &cart);
    int cartRank, coords[2];
    MPI_Comm_rank(cart, &cartRank);
    MPI_Cart_coords(cart, cartRank, 2, coords);
    answer(rank, std::to_string(coords[0]) + " " + std::to_string(coords[1]));
    MPI_Comm_free(&cart);
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin83. Координаты матрицы N × K/N.",
                 InputRanks::root, 2, false, false, readInput, solve};
    return run(argc, argv, task);
}
