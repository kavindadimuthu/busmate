package com.busmate.ticketing_service.repository;
import com.busmate.ticketing_service.entity.BaseFare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.stereotype.Repository;

@EnableJpaRepositories
@Repository

public interface BaseFareRepo  extends JpaRepository<BaseFare, Integer> {


}
