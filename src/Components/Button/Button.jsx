import './Button.css'

function Botao({ onClick, nome, tipo}) {
  return (
    <button 
      type={tipo} 
      onClick={onClick} 
      className="register-button">
      {nome}
    </button>
  )
}

export default Botao