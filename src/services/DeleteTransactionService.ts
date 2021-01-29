import { getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionRepository = getRepository(Transaction);
    if (!id) throw new AppError('An id is required to delete a transaction');

    // checar se o id recebido realmente existe (findOne)

    await transactionRepository.delete(id);
  }
}

export default DeleteTransactionService;
