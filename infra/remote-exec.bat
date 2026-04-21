@echo off
"D:\Program Files\PuTTY\plink.exe" -ssh sql@192.168.1.251 -pw Linxi@sql -batch %*
