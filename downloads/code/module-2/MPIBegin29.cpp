// MPIBegin29. Наборы двух типов. Получение типа из тега сообщения.
#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int, const Rows&) {
    for (;;) {
        Row row = readLine(label(rank) + "тип (0 — целые, 1 — вещественные), затем до 10 чисел: ");
        if (row.empty() || (row[0] != "0" && row[0] != "1")) {
            std::cout << "Ошибка: первое число — тип набора: 0 для целых, 1 для вещественных. Повторите строку.\n";
            continue;
        }
        if (row.size() > 11) {
            std::cout << "Ошибка: после типа можно ввести не более 10 чисел. Повторите строку.\n";
            continue;
        }
        const bool integers = row[0] == "0";
        bool valid = true;
        for (size_t i = 1; i < row.size(); ++i) {
            if (!normalizeToken(row[i], integers)) {
                std::cout << "Ошибка: число №" << i << " в наборе должно быть "
                          << (integers ? "целым (например, 2)" : "вещественным с точкой (например, 2.0)")
                          << ". Введено: \"" << row[i] << "\". Повторите строку.\n";
                valid = false;
                break;
            }
        }
        if (valid) return row;
    }
}

void solve(int rank, int size, const Row& row) {
    MPI_Comm comm = MPI_COMM_WORLD;
    if (rank > 0) {
        int type = std::stoi(row.at(0));
        int n = static_cast<int>(row.size()) - 1;
        if (n > 10) throw std::invalid_argument("N");
        if (type == 0) {
            int data[10]{};
            for (int i = 0; i < n; ++i) data[i] = std::stoi(row[i + 1]);
            MPI_Send(data, n, MPI_INT, 0, type, comm);
        } else {
            double data[10]{};
            for (int i = 0; i < n; ++i) data[i] = unpackReal(row[i + 1]);
            MPI_Send(data, n, MPI_DOUBLE, 0, type, comm);
        }
    } else {
        Row values;
        for (int source = 1; source < size; ++source) {
            MPI_Status status;
            MPI_Probe(source, MPI_ANY_TAG, comm, &status);
            int tag = status.MPI_TAG, count;
            if (tag == 0) {
                int data[10]{};
                MPI_Get_count(&status, MPI_INT, &count);
                MPI_Recv(data, count, MPI_INT, source, tag, comm, &status);
                for (int i = 0; i < count; ++i) values.push_back(std::to_string(data[i]));
            } else {
                double data[10]{};
                MPI_Get_count(&status, MPI_DOUBLE, &count);
                MPI_Recv(data, count, MPI_DOUBLE, source, tag, comm, &status);
                for (int i = 0; i < count; ++i) values.push_back(decimal(data[i]));
            }
        }
        answer(0, join(values));
    }
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin29. Наборы двух типов. Получение типа из тега сообщения.", InputRanks::workers, 1, false, false, readInput, solve};
    return run(argc, argv, task);
}
