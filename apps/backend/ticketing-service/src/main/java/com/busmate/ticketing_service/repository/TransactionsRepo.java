package com.busmate.ticketing_service.repository;

import com.busmate.ticketing_service.entity.Transactions;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionsRepo extends JpaRepository<Transactions, Integer> {
}
