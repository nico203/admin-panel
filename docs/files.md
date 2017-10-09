file
-url: ruta a la que se asocia el archivo. Por defecto /files
-prop: campo del objeto al que se asocia el archivo. Por defecto 'file'

Posibles valores para file:
file: true -> genera los valores por defecto
file: 'cadena' -> genera los valores en plural para la url y el campo para la cadena. Debe ser especificado en singular
file: obj -> debe tener los valores url y prop, segun especificacion

Proceso del GET.
Al obtener los datos de la entidad se pueden tener los siguientes valores
-null: el archivo no fue especificado.
-string: una cadena con el fullpath hacia el archivo.

Proceso del POST:
Al persistir los datos de una entidad se pueden tener los siguientes escenarios:
-No se modifican los datos, ya sea que exista el campo o no:
	En este caso se manda un campo null y el valor del archivo no se modifica.
-Que haya un valor especificado y se quiera borrar:
	En este caso se manda el campo false, y el archivo se elimina.
-Se modifican los datos, ya sea que exista el archivo o no en la bd:
	En este caso, se manda un objeto tipo File o Blob javascript, el cual es enviado a la api con un post extra. Cuando se modifican los datos, el archivo existente en la API se deberia eliminar.

