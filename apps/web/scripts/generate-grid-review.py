"""Offline authoring only. Emit a static 12x12 fully occupied review puzzle."""
import json, math, random
from pathlib import Path

N=12
C=(5.5,8)
R=2.1
HALF=.125
def dist(p,a,b):
    dx,dy=b[0]-a[0],b[1]-a[1]
    t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)))
    return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)
def cross(a,b): return a[0]*b[1]-a[1]*b[0]
def sub(a,b): return (a[0]-b[0],a[1]-b[1])
def intersects(a,b,c,d):
    v,w=sub(b,a),sub(d,c); den=cross(v,w)
    if abs(den)<1e-9: return False
    t,s=cross(sub(c,a),w)/den,cross(sub(c,a),v)/den
    return 1e-8<t<1-1e-8 and 1e-8<s<1-1e-8
def ray_hits(points,other):
    a,b=points[-2:]; dx,dy=sub(b,a); m=math.hypot(dx,dy); u=(dx/m,dy/m)
    start=(b[0]+u[0]*.57,b[1]+u[1]*.57)
    # Ray versus the same square/miter stroke outline used by the app.
    units=[]
    for p,q in zip(other,other[1:]):
        x,y=sub(q,p); z=math.hypot(x,y); units.append((x/z,y/z))
    def side(sign):
        out=[]
        for i,p in enumerate(other):
            v,w=units[max(0,i-1)],units[min(i,len(units)-1)]
            f=sign*HALF/(1+v[0]*w[0]+v[1]*w[1])
            out.append((p[0]-(v[1]+w[1])*f,p[1]+(v[0]+w[0])*f))
        return out
    poly=side(1)+list(reversed(side(-1)))
    for p,q in zip(poly,poly[1:]+poly[:1]):
        v=sub(q,p); den=cross(u,v)
        if abs(den)<1e-9: continue
        w=sub(p,start); t,s=cross(w,v)/den,cross(w,u)/den
        if t>=-1e-8 and -1e-8<=s<=1+1e-8: return True
    return False
def hits_circle(points):
    a,b=points[-2:]; dx,dy=sub(b,a); m=math.hypot(dx,dy); u=(dx/m,dy/m)
    t=(C[0]-b[0])*u[0]+(C[1]-b[1])*u[1]
    return t>=0 and abs(cross(sub(C,b),u))<=R

fixed=[[(4,1),(3,2),(2,3)],[(5,2),(6,3)],[(8,1),(8,2),(8,3),(8,4)],[(7,2),(6,2)]]
excluded={(x,y) for y in range(N) for x in range(N) if math.hypot(x-C[0],y-C[1])<=R+HALF}
assert not excluded.intersection(p for path in fixed for p in path)
nodes={(x,y) for y in range(N) for x in range(N)}-excluded

for seed in range(5000):
    rng=random.Random(seed)
    paths=[list(p) for p in fixed]
    free=nodes-{p for path in fixed for p in path}
    edges=[(a,b) for path in fixed for a,b in zip(path,path[1:])]
    while free:
        # Low-degree cells first avoid isolated fragments around the ring.
        degree=lambda p:sum((p[0]+dx,p[1]+dy) in free for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)])
        low=min(degree(p) for p in free)
        start=rng.choice(sorted(p for p in free if degree(p)==low))
        path=[start];free.remove(start);goal=rng.randint(4,12)
        while len(path)<goal:
            p=path[-1]; choices=[]
            for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]:
                q=(p[0]+dx,p[1]+dy)
                if q not in free or dist(C,p,q)<=R+HALF:continue
                if any(intersects(p,q,a,b) for a,b in edges):continue
                choices.append(q)
            if not choices:break
            # Favor a continuation, with occasional turns for interlocking paths.
            if len(path)>1 and rng.random()<.6:
                d=sub(path[-1],path[-2]);straight=(p[0]+d[0],p[1]+d[1])
                q=straight if straight in choices else rng.choice(choices)
            else:q=rng.choice(choices)
            edges.append((p,q));path.append(q);free.remove(q)
        paths.append(path)
    if any(len(p)==1 for p in paths):continue
    options=[]
    for i,path in enumerate(paths):
        variants=[path] if i<4 else [path,list(reversed(path))]
        options.append([v for v in variants if not ray_hits(v,v)])
    if any(not o for o in options):continue
    # A free orientation can be removed permanently; body geometry is unchanged
    # by orientation, so choosing one free option cannot make others less free.
    pending=set(range(len(paths))); chosen={};order=[]
    while pending:
        found=False
        ring=any(i in pending for i in range(4))
        for i in sorted(pending):
            for v in options[i]:
                if ring and hits_circle(v):continue
                if any(j!=i and ray_hits(v,paths[j]) for j in pending):continue
                chosen[i]=v;order.append(i);pending.remove(i);found=True;break
            if found:break
        if not found:break
    if pending:continue
    data={'size':N,'pitch':32,'origin':40,'circle':{'x':C[0],'y':C[1],'radius':R},
          'excluded':[list(p) for p in sorted(excluded)],
          'paths':[chosen[i] for i in range(len(paths))],'solution':order,'seed':seed}
    out=Path(__file__).resolve().parents[1]/'src/game/grid-review.generated.json'
    out.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'seed={seed}; paths={len(paths)}; covered={len(nodes)}; excluded={len(excluded)}')
    break
else:raise RuntimeError('No valid tiling found')
