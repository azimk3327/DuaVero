package com.duavero.core.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final AppProperties appProperties;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        AppProperties.Cors cors = appProperties.getSecurity().getCors();
        registry.addMapping("/**")
                .allowedOrigins(cors.getAllowedOrigins().toArray(new String[0]))
                .allowedMethods(cors.getAllowedMethods().toArray(new String[0]))
                .allowedHeaders(cors.getAllowedHeaders().toArray(new String[0]))
                .allowCredentials(cors.isAllowCredentials())
                .maxAge(cors.getMaxAgeSeconds());
    }
}
