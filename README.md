
# Sherrif

Sherrif is a quick and easy way to create new jailed users (chroot) in a linux environment (tested in Ubuntu 16.0.4) so that they can have their own website on your server with sftp access, but not ssh. Sherrif gives users a home directory with write access to a single directory `www` which is mounted from `/var/www/jailed/_username_/www`.

Sherrif is a node.js application. Assumptions are that [node](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-16-04), [openssh](https://www.digitalocean.com/community/tutorials/initial-server-setup-with-ubuntu-16-04), and [apache2](https://www.digitalocean.com/community/tutorials/how-to-set-up-apache-virtual-hosts-on-ubuntu-14-04-lts) are already installed and configured.

## Configuration

1. First, we need to create the sftponly group
```
sudo groupadd sftponly
```

1. Next, we configure permissions for the `sftponly` group. Add the following at the bottom of the `/etc/ssh/sshd_config` file as sudo user.
```
Match Group sftponly
  ChrootDirectory %h
  ForceCommand internal-sftp
  AllowTcpForwarding no
  PermitTunnel no
  X11Forwarding no
```

1. Now restart the sshd service
```
sudo systemctl restart sshd.service
```

1. Create a new directory called `jailed` in `/var/www/`. This is where Sherrif will create new directories for your jailed users to access. Eventually, you will need to point virtual hosts to the `www` directory(ies) created here (Sherrif won't complete that part of the opperation for you).
```
sudo mkdir /var/www/jailed/
```

1. Create a new directory called `user_backups` in your home directory. This is where removed users' data will be compressed and stored when deleted from the system. If you don't care to back up old users, you may skip this step.

## Usage
Simply run `sudo node index.js` and follow the prompts.

To remove a user, simply supply the username of an existing user and the script will ask if you want to permamently remove the user and whether or not you want to back up their files before removing.

