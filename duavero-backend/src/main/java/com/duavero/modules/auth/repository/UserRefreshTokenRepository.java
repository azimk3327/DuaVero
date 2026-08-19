package com.duavero.modules.auth.repository;

import com.duavero.modules.auth.model.UserRefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRefreshTokenRepository extends JpaRepository<UserRefreshToken, Long> {

    Optional<UserRefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("UPDATE UserRefreshToken urt SET urt.revoked = true WHERE urt.userId = :userId")
    int revokeAllByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE UserRefreshToken urt SET urt.revoked = true WHERE urt.tokenHash = :tokenHash")
    int revokeByTokenHash(@Param("tokenHash") String tokenHash);
}
