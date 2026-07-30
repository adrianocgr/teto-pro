package br.com.tetoproobra.configuracao;

import br.com.tetoproobra.compartilhado.multitenancy.ResolvedorTenantAtual;
import org.hibernate.cfg.AvailableSettings;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class HibernateConfig {

    @Bean
    public HibernatePropertiesCustomizer resolvedorDeTenantCustomizer(ResolvedorTenantAtual resolvedor) {
        return propriedades -> propriedades.put(AvailableSettings.MULTI_TENANT_IDENTIFIER_RESOLVER, resolvedor);
    }
}
