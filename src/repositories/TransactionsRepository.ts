import {
  EntityRepository,
  getCustomRepository,
  getRepository,
  Repository,
} from 'typeorm';
import AppError from '../errors/AppError';
import Category from '../models/Category';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface TransactionInterface {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    let income = 0;
    let outcome = 0;
    transactions.forEach(t => {
      if (t.type === 'income') income -= -t.value;
      else outcome -= -t.value;
    });
    const total = income - outcome;

    return {
      income,
      outcome,
      total,
    };
  }

  public async createTransaction({
    title,
    value,
    type,
    category,
  }: TransactionInterface): Promise<Transaction> {
    // CATCHING CATEGORY ID
    const categoryRepository = getRepository(Category);
    if (!category) throw new AppError('A category must need a title');

    let categoryObject = await categoryRepository.findOne({
      where: { title: category },
    });

    let categoryId;

    if (categoryObject) {
      categoryId = categoryObject.id;
    } else {
      categoryObject = categoryRepository.create({ title: category });
      await categoryRepository.save(categoryObject);
      categoryId = categoryObject.id;
    }

    // TRANSACTION VALIDATION
    const transactionRepository = getCustomRepository(TransactionsRepository);

    if (!title) throw new AppError('A transaction must need a title');

    if (Number.isNaN(value - 0))
      throw new AppError('A transaction must need a value');

    if (type !== 'income' && type !== 'outcome')
      throw new AppError('A transaction must be income type or outcome type');

    const { total } = await this.getBalance();
    if (type === 'outcome' && total - value < 0)
      throw new AppError('Insufficient balance to execute the transaction');

    // PREPARING TRANSACTION TO DATABASE
    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id: categoryId,
    });

    await transactionRepository.save(transaction);

    const { id } = transaction;
    const { created_at } = transaction;
    const { updated_at } = transaction;

    return {
      id,
      title,
      type,
      value,
      category_id: categoryId,
      created_at,
      updated_at,
      category: categoryObject,
    };
  }
}

export default TransactionsRepository;
