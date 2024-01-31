# Aircraft router

Sustav za usmjeravanje promatrača sa točke na Zemlji prema zrakoplovu - napravljeno u sklopu predmeta **Projekt R** Fakulteta elektrotehnike i računarstva. 


# Opis

Sustav je dizajniran s namjerom da prima signale **ADS-B**, koji su prethodno dekodirani pomoću alata **dump1090**. Zatim, na temelju dobivenih informacija, izračunava azimut i kut visine promatrača na Zemlji u odnosu na položaj zrakoplova. Ovi rezultati vizualiziraju se na korisničkoj konzoli i pohranjuju u zasebnu tekstualnu datoteku. Korisnik ima mogućnost prilagodbe postavki programa putem **config.json** datoteke, gdje može unijeti vlastite koordinate, odabrati željenu lokaciju i naziv tekstualne datoteke u koju će se bilježiti podaci o zrakoplovima.

## ADS-B

ADS-B (Automatic Dependent Surveillance–Broadcast) je sustav praćenja zrakoplova koji omogućuje zrakoplovima da emitiraju informacije o vlastitom položaju, brzini, visini i drugim relevantnim podacima putem radio signala. Ove informacije se šalju putem radijskih odašiljača, omogućujući drugim zrakoplovima i zemaljskim kontrolama da ih prate u stvarnom vremenu. 
