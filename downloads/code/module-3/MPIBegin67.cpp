// MPIBegin67. Упаковка и рассылка троек.
#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int size, const Rows&) {
    return mixedTriples(rank, size - 1, 1, "вещественное");
}

void packTriple(const Row& row, int start, char* packet, int capacity) {
    int position = 0;
    int first = std::stoi(row.at(start + 0));
    MPI_Pack(&first, 1, MPI_INT, packet, capacity, &position, MPI_COMM_WORLD);
    double real = std::stod(row.at(start + 1));
    MPI_Pack(&real, 1, MPI_DOUBLE, packet, capacity, &position, MPI_COMM_WORLD);
    int second = std::stoi(row.at(start + 2));
    MPI_Pack(&second, 1, MPI_INT, packet, capacity, &position, MPI_COMM_WORLD);
}

std::string unpackTriple(char* packet, int capacity) {
    int position = 0;
    int first, second;
    double real;
    MPI_Unpack(packet, capacity, &position, &first, 1, MPI_INT, MPI_COMM_WORLD);
    MPI_Unpack(packet, capacity, &position, &real, 1, MPI_DOUBLE, MPI_COMM_WORLD);
    MPI_Unpack(packet, capacity, &position, &second, 1, MPI_INT, MPI_COMM_WORLD);
    return std::to_string(first) + " " + decimal(real) + " " + std::to_string(second);
}

void solve(int rank, int size, const Row& row) {
    int intBytes, realBytes;
    MPI_Pack_size(1, MPI_INT, MPI_COMM_WORLD, &intBytes);
    MPI_Pack_size(1, MPI_DOUBLE, MPI_COMM_WORLD, &realBytes);
    int width = 2 * intBytes + realBytes;
    std::vector<char> packets(size * width), local(width);
    if (rank == 0)
        for (int r = 1; r < size; ++r) packTriple(row, (r - 1) * 3, packets.data() + r * width, width);
    MPI_Scatter(packets.data(), width, MPI_BYTE, local.data(), width, MPI_BYTE, 0, MPI_COMM_WORLD);
    if (rank != 0) answer(rank, unpackTriple(local.data(), width));
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin67. Упаковка и рассылка троек.", InputRanks::root, 2, false, false, readInput, solve};
    return run(argc, argv, task);
}
