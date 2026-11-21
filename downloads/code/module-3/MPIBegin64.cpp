// MPIBegin64. Сбор троек составного типа во всех процессах.
#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int, const Rows&) {
    return mixedTriples(rank, 1, 1, "вещественное");
}

struct Record { int first, last; double real; };

Record readRecord(const Row& row, int start) {
    return {std::stoi(row.at(start)), std::stoi(row.at(start + 2)), std::stod(row.at(start + 1))};
}

std::string showRecord(const Record& record) {
    return std::to_string(record.first) + " " + decimal(record.real) + " " + std::to_string(record.last);
}

void solve(int rank, int size, const Row& row) {
    int lengths[] = {2, 1};
    MPI_Aint offsets[] = {offsetof(Record, first), offsetof(Record, real)};
    MPI_Datatype fields[] = {MPI_INT, MPI_DOUBLE}, triple;
    MPI_Type_create_struct(2, lengths, offsets, fields, &triple);
    MPI_Type_commit(&triple);
    std::vector<Record> records(size);
    Record local = readRecord(row, 0);
    MPI_Allgather(&local, 1, triple, records.data(), 1, triple, MPI_COMM_WORLD);
    Row result;
    for (const auto& record : records) result.push_back(showRecord(record));
    answer(rank, join(result));
    MPI_Type_free(&triple);
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin64. Сбор троек составного типа во всех процессах.", InputRanks::all, 1, false, false, readInput, solve};
    return run(argc, argv, task);
}
