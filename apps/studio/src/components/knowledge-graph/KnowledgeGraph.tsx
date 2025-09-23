import { useEffect, useRef, useCallback } from 'react'
import * as PIXI from 'pixi.js'
import dagre from 'dagre'
import { useSkillsStore } from '@/stores/skills-store'

export function KnowledgeGraph() {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const graphicsRef = useRef<Map<string, PIXI.Container>>(new Map())
  
  const {
    skills,
    prerequisites,
    selectedSkillId,
    highlightedSkills,
    loadSkills,
    selectSkill,
    setSkillPosition
  } = useSkillsStore()
  
  // Initialize PIXI app and load skills
  useEffect(() => {
    if (!containerRef.current) return
    
    // Load skills data
    void loadSkills().catch((error) => {
      console.error('Failed to load skills', error)
    })
    
    // Create PIXI Application
    const app = new PIXI.Application()
    
    app.init({
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: 0xf8fafc,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    }).then(() => {
      containerRef.current?.appendChild(app.canvas)
      appRef.current = app
      
      // Initial render
      renderGraph()
    })
    
    // Handle resize
    const handleResize = () => {
      if (app && containerRef.current) {
        app.renderer.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        )
        renderGraph()
      }
    }
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      app.destroy(true, { children: true })
    }
  }, [])
  
  // Render graph using dagre layout
  const renderGraph = useCallback(() => {
    const app = appRef.current
    if (!app || skills.size === 0) return
    
    // Clear stage
    app.stage.removeChildren()
    graphicsRef.current.clear()
    
    // Create dagre graph
    const g = new dagre.graphlib.Graph()
    g.setGraph({
      rankdir: 'TB',
      nodesep: 50,
      edgesep: 10,
      ranksep: 100,
      marginx: 50,
      marginy: 50
    })
    g.setDefaultEdgeLabel(() => ({}))
    
    // Add nodes to dagre
    skills.forEach(skill => {
      g.setNode(skill.id, { 
        label: skill.name, 
        width: 120, 
        height: 60 
      })
    })
    
    // Add edges to dagre
    prerequisites.forEach(prereq => {
      g.setEdge(prereq.fromId, prereq.toId)
    })
    
    // Calculate layout
    dagre.layout(g)
    
    // Container for entire graph
    const graphContainer = new PIXI.Container()
    app.stage.addChild(graphContainer)
    
    // Draw edges first (so they appear behind nodes)
    const edgeGraphics = new PIXI.Graphics()
    graphContainer.addChild(edgeGraphics)
    
    prerequisites.forEach(prereq => {
      const fromNode = g.node(prereq.fromId)
      const toNode = g.node(prereq.toId)
      
      if (!fromNode || !toNode) return
      
      const isHighlighted = 
        highlightedSkills.has(prereq.fromId) && 
        highlightedSkills.has(prereq.toId)
      
      edgeGraphics.moveTo(fromNode.x, fromNode.y)
      edgeGraphics.lineTo(toNode.x, toNode.y)
      edgeGraphics.stroke({
        width: isHighlighted ? 3 : 1,
        color: isHighlighted ? 0x3b82f6 : 0xd1d5db
      })
      
      // Draw arrow head
      const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x)
      const arrowSize = 8
      const arrowX = toNode.x - Math.cos(angle) * 35
      const arrowY = toNode.y - Math.sin(angle) * 35
      
      edgeGraphics.moveTo(arrowX, arrowY)
      edgeGraphics.lineTo(
        arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
        arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
      )
      edgeGraphics.moveTo(arrowX, arrowY)
      edgeGraphics.lineTo(
        arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
        arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
      )
      edgeGraphics.stroke({
        width: isHighlighted ? 3 : 1,
        color: isHighlighted ? 0x3b82f6 : 0xd1d5db
      })
    })
    
    // Draw nodes
    skills.forEach(skill => {
      const node = g.node(skill.id)
      if (!node) return
      
      // Update position in store
      setSkillPosition(skill.id, node.x, node.y)
      
      // Create node container
      const nodeContainer = new PIXI.Container()
      nodeContainer.x = node.x
      nodeContainer.y = node.y
      nodeContainer.eventMode = 'static'
      nodeContainer.cursor = 'pointer'
      
      // Determine colors
      const isSelected = skill.id === selectedSkillId
      const isHighlighted = highlightedSkills.has(skill.id)
      
      let bgColor = 0xffffff
      let borderColor = 0xe5e7eb
      let borderWidth = 2
      
      if (isSelected) {
        bgColor = 0x3b82f6
        borderColor = 0x2563eb
        borderWidth = 3
      } else if (isHighlighted) {
        bgColor = 0xdbeafe
        borderColor = 0x3b82f6
        borderWidth = 2
      }
      
      // Draw node background
      const nodeGraphics = new PIXI.Graphics()
      nodeGraphics.rect(-60, -30, 120, 60)
      nodeGraphics.fill(bgColor)
      nodeGraphics.stroke({ width: borderWidth, color: borderColor })
      nodeContainer.addChild(nodeGraphics)
      
      // Add text
      const text = new PIXI.Text({
        text: skill.id,
        style: {
          fontFamily: 'Arial',
          fontSize: 14,
          fontWeight: 'bold',
          fill: isSelected ? 0xffffff : 0x1f2937,
          align: 'center'
        }
      })
      text.anchor.set(0.5)
      text.y = -10
      nodeContainer.addChild(text)
      
      // Add name (truncated)
      const nameText = new PIXI.Text({
        text: skill.name.length > 15 ? 
          skill.name.substring(0, 12) + '...' : 
          skill.name,
        style: {
          fontFamily: 'Arial',
          fontSize: 10,
          fill: isSelected ? 0xe0e7ff : 0x6b7280,
          align: 'center',
          wordWrap: true,
          wordWrapWidth: 100
        }
      })
      nameText.anchor.set(0.5)
      nameText.y = 5
      nodeContainer.addChild(nameText)
      
      // Handle click
      nodeContainer.on('pointerdown', () => {
        selectSkill(skill.id === selectedSkillId ? null : skill.id)
      })
      
      // Store reference
      graphicsRef.current.set(skill.id, nodeContainer)
      graphContainer.addChild(nodeContainer)
    })
    
    // Center the graph
    const bounds = graphContainer.getBounds()
    graphContainer.x = (app.renderer.width - bounds.width) / 2
    graphContainer.y = 50
    
    // Enable panning
    let isDragging = false
    let dragStart = { x: 0, y: 0 }
    let containerStart = { x: 0, y: 0 }
    
    app.stage.eventMode = 'static'
    app.stage.on('pointerdown', (e) => {
      if (e.target === app.stage) {
        isDragging = true
        dragStart = { x: e.global.x, y: e.global.y }
        containerStart = { x: graphContainer.x, y: graphContainer.y }
      }
    })
    
    app.stage.on('pointermove', (e) => {
      if (isDragging) {
        graphContainer.x = containerStart.x + (e.global.x - dragStart.x)
        graphContainer.y = containerStart.y + (e.global.y - dragStart.y)
      }
    })
    
    app.stage.on('pointerup', () => {
      isDragging = false
    })
    app.stage.on('pointerupoutside', () => {
      isDragging = false
    })
    
  }, [skills, prerequisites, selectedSkillId, highlightedSkills, selectSkill, setSkillPosition])
  
  // Re-render when data changes
  useEffect(() => {
    renderGraph()
  }, [skills, prerequisites, selectedSkillId, highlightedSkills, renderGraph])
  
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full bg-slate-50 rounded-lg overflow-hidden"
      style={{ minHeight: '600px' }}
    />
  )
}
