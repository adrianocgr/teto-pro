package br.com.tetoproobra.categoria.infraestrutura;

import br.com.tetoproobra.categoria.dominio.Categoria;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

    List<Categoria> findByCategoriaPaiIsNull();

    List<Categoria> findByCategoriaPai_Id(Long categoriaPaiId);
}
