"""Empaqueta un .app compilado. No genera certificados ni firma para instalación."""
import sys, pathlib, zipfile, plistlib, hashlib, json
source=pathlib.Path(sys.argv[1]).resolve()
output=pathlib.Path(sys.argv[2]).resolve()
if not source.is_dir() or source.suffix!='.app': raise SystemExit('No existe el .app compilado')
info=plistlib.loads((source/'Info.plist').read_bytes())
if not (source/info['CFBundleExecutable']).is_file(): raise SystemExit('Falta el ejecutable compilado')
output.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(source.rglob('*')):
        if file.is_file(): archive.write(file,'Payload/'+source.name+'/'+file.relative_to(source).as_posix())
digest=hashlib.sha256(output.read_bytes()).hexdigest()
output.with_suffix('.sha256').write_text(digest+'  '+output.name+'\n',encoding='utf-8')
output.with_suffix('.json').write_text(json.dumps({'bundleId':info['CFBundleIdentifier'],'sha256':digest,'signedForDevice':False,'catalogConnected':False,'note':'Requiere firma para el dispositivo. Este artefacto no conecta al servicio de Xuper.'},indent=2),encoding='utf-8')
print(output.name,digest)
