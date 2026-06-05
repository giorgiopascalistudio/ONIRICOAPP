Metti qui i 13 file del modello 3D:
  step-01.glb  step-02.glb  ...  step-13.glb

Sono gli stessi file che già usavi (cartella "model" della vecchia repo,
oppure dal model.zip che ti avevo preparato).

Durante il build di Vite, il contenuto di /public viene copiato così com'è
nella cartella di output, quindi i modelli saranno raggiungibili a
  <indirizzo-del-sito>/model/step-01.glb
e l'app li carica automaticamente. Non rinominarli.
