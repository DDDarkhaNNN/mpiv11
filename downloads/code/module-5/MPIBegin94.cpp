#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int size, const Rows& rows) {
    if (rank == 0) {
        for (;;) {
            Row dimensions = numbers("Ранг 0 — положительные целые M и N (M·N ≤ K): ", 2, 2, true);
            const int m = std::stoi(dimensions[0]), n = std::stoi(dimensions[1]);
            if (m > 0 && n > 0 && m <= size / n) {
                Row coords = numbers("Ранг 0 — целые координаты X и Y: ", 2, 2, true);
                dimensions.insert(dimensions.end(), coords.begin(), coords.end());
                return dimensions;
            }
            std::cout << "Ошибка: M и N должны быть положительными, M·N не больше K. Повторите строку.\n";
        }
    }
    const int m = std::stoi(rows[0].at(0)), n = std::stoi(rows[0].at(1));
    if (rank >= m * n) return {};
    return numbers(label(rank) + "целые координаты X и Y: ", 2, 2, true);
}

void solve(int rank, int, const Row& row) {
    int dims[2] = {0, 0};
    if (rank == 0) {
        dims[0] = std::stoi(row.at(0));
        dims[1] = std::stoi(row.at(1));
    }
    MPI_Bcast(dims, 2, MPI_INT, 0, MPI_COMM_WORLD);
    int periods[2] = {0, 1};
    MPI_Comm cart;
    MPI_Cart_create(MPI_COMM_WORLD, 2, dims, periods, 0, &cart);
    if (cart != MPI_COMM_NULL) {
        const int x = std::stoi(row.at(rank == 0 ? 2 : 0));
        const int y = std::stoi(row.at(rank == 0 ? 3 : 1));
        int target = -1;
        if (x >= 0 && x < dims[0]) {
            int coords[2] = {x, (y % dims[1] + dims[1]) % dims[1]};
            MPI_Cart_rank(cart, coords, &target);
        }
        answer(rank, std::to_string(target));
        MPI_Comm_free(&cart);
    }
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin94. Периодичность второго измерения: ранг координат X,Y.",
                 InputRanks::all, 2, false, false, readInput, solve};
    return run(argc, argv, task);
}
