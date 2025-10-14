package com.resourceshare.service;

import com.resourceshare.dto.AuthResponse;
import com.resourceshare.dto.LoginRequest;
import com.resourceshare.dto.RegisterRequest;
import com.resourceshare.entity.Donor;
import com.resourceshare.entity.User;
import com.resourceshare.enums.UserRole;
import com.resourceshare.repository.DonorRepository;
import com.resourceshare.repository.UserRepository;
import com.resourceshare.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Servicio de autenticación y registro de usuarios
 * Maneja login, registro y generación de tokens JWT
 */
@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DonorRepository donorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    /**
     * Registra un nuevo usuario en el sistema
     * Si el rol es DONOR, crea también el registro en la tabla donors
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Validar que el email no exista
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("El email ya está registrado");
        }

        // Crear usuario
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setRole(request.getRole());
        user.setActive(true);

        User savedUser = userRepository.save(user);

        // Si es DONOR, crear registro adicional en la tabla donors
        if (request.getRole() == UserRole.DONOR) {
            Donor donor = new Donor();
            donor.setUser(savedUser);
            donor.setAddress(request.getAddress());
            donor.setCity(request.getCity());
            donor.setTotalDonations(0);
            donor.setCompletedDonations(0);
            donorRepository.save(donor);
        }

        // Generar token JWT
        String token = tokenProvider.generateTokenFromEmail(savedUser.getEmail());

        // Construir respuesta
        return AuthResponse.builder()
                .token(token)
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .firstName(savedUser.getFirstName())
                .lastName(savedUser.getLastName())
                .role(savedUser.getRole())
                .message("Usuario registrado exitosamente")
                .build();
    }

    /**
     * Autentica un usuario con email y contraseña
     * Retorna token JWT si las credenciales son válidas
     */
    public AuthResponse login(LoginRequest request) {
        // Autenticar con Spring Security
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Generar token JWT
        String token = tokenProvider.generateToken(authentication);

        // Obtener datos del usuario
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Construir respuesta
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .message("Login exitoso")
                .build();
    }
}
