package com.busmate.ticketing_service.repository;

import com.busmate.ticketing_service.entity.Online;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OnlineRepo extends JpaRepository<Online, Long> {
}
