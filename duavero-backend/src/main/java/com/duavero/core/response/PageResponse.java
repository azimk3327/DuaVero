package com.duavero.core.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.slf4j.MDC;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PageResponse<T> {

    @Builder.Default
    private boolean success = true;

    private List<T> data;

    private int page;

    private int size;

    private long totalElements;

    private int totalPages;

    private boolean last;

    @Builder.Default
    private String correlationId = MDC.get("correlationId");

    public static <T> PageResponse<T> of(Page<T> page) {
        return PageResponse.<T>builder()
                .success(true)
                .data(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .correlationId(MDC.get("correlationId"))
                .build();
    }
}
