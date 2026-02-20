#!/bin/bash
# =================================================================
# Configura 1 GB de swap na EC2 (t3.micro)
# Execute UMA VEZ como root na EC2: sudo bash setup_swap.sh
# =================================================================

SWAPFILE="/swapfile"
SWAPSIZE="1G"

if swapon --show | grep -q "$SWAPFILE"; then
  echo "✅ Swap já está ativo em $SWAPFILE"
  swapon --show
  exit 0
fi

echo "📦 Criando arquivo de swap ($SWAPSIZE)..."
fallocate -l $SWAPSIZE $SWAPFILE
chmod 600 $SWAPFILE
mkswap $SWAPFILE
swapon $SWAPFILE

# Persiste entre reboots
if ! grep -q "$SWAPFILE" /etc/fstab; then
  echo "$SWAPFILE none swap sw 0 0" >> /etc/fstab
fi

# Reduz agressividade de swap (60 = padrão; 10 = usa swap só em emergência)
sysctl vm.swappiness=10
echo "vm.swappiness=10" >> /etc/sysctl.conf

echo ""
echo "✅ Swap configurado com sucesso!"
swapon --show
free -h
