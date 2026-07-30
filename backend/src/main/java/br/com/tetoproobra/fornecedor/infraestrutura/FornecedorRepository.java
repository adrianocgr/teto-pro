package br.com.tetoproobra.fornecedor.infraestrutura;

import br.com.tetoproobra.fornecedor.dominio.Fornecedor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FornecedorRepository extends JpaRepository<Fornecedor, Long> {

    Page<Fornecedor> findByRazaoSocialContainingIgnoreCaseOrCnpjCpfContaining(
            String razaoSocial, String cnpjCpf, Pageable pageable);
}
