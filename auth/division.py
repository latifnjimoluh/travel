def division_euclidienne(a, b):
    if b == 0:
        raise ValueError("La division par zéro n'est pas définie.")
    
    quotient = a // b  # Division entière
    reste = a % b      # Reste de la division

    return quotient, reste

# Exemple d'utilisation
a = 10
b = 3
quotient, reste = division_euclidienne(a, b)

print(f"Pour {a} divisé par {b}:")
print(f"Quotient: {quotient}, Reste: {reste}")
