# Nexo Ex Azure

Zestaw **Nexo EX** służy do budowania, pakowania, aktualizacji rozszerzenia dla programu **InsERT Nexo**

# Jak używać
### Nexo SDK
```
- task: NexoSDK@0
      inputs:
        versionSpec: '37.0.1'
```

Po poprawnym wykonaniu zadania zostanie pobrane sdk oraz do zmiennych środowiskowych `NexoDllPath` zostanie dodana ścieżka do binarów. W pliku `*.csproj` należy podać ścieżkę do refernecji ze zmienną `$(NexoDllPath)\InsERT.Moria.API.dll`
### Nexo Packer
1. Pakowanie - po wynokaniu zadana powstaje plik `*.mpkg` który znajduje się w `SourceDirectory`
```
- task: NexoPacker@0
      inputs:
        command: pack
        SourceDirectory: 'Nexo.Extension\bin\Release'
        Version: '1.0.0.$(Build.BuildId)'
        Name: 'My_Super_Nexo_API'
        ExcludedPatterns: '*.pdb;*.xml'
```
2. Dodawanie binariów
```
- task: NexoPacker@0
  inputs:
    command: upload
    Source: 'My_Super_Nexo_API.mpkg'
    ConnectionString: 'połączenie do bazy Launcher'
```
3. Instalacja w podmiocie
```
- task: NexoPacker@0
  inputs:
    command: install
    Source: 'My_Super_Nexo_API.mpkg'
    ConnectionString: 'połączenie do bazy danych podmiotu'
    ReplaceOld: true
```
4. Czyszczenie starych wersji
```
- task: NexoPacker@0
  inputs:
    command: cleanup
    ConnectionString: 'połączenie do bazy Launcher'
    ExName: 'My_Super_Nexo_API'
```
# Przydatne linki
[InsERT Nexo](https://www.insert.com.pl/przejdz_na_insert_nexo.html)
[Nexo Installer](https://github.com/mateo942/NexoInstaller)
[Rozszerzenie Marketplace](https://marketplace.visualstudio.com/items?itemName=PiatekDev.nexo-ex-azure)

