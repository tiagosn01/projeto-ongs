import * as Yup from 'yup';
import Animal from '../models/Animal';
import User from '../models/User';
import File from '../models/File';
import Admin from '../models/Admin';

class AnimalController {
  async index(req, res) {
    const { id } = req.params;
    const listAnimals = await Animal.findAll({
      where: {
        institution_id: id,
        situation: false,
      },
      attributes: ['id', 'name', 'sex', 'type', 'detail'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    return res.json(listAnimals);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      sex: Yup.string().required(),
      type: Yup.string().required(),
      detail: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Erro de validação' });
    }

    const admin = await Admin.findOne({ where: { user_id: req.userId } });

    if (!admin) {
      return res.status(401).json({ error: 'Não autorizado.' });
    }

    const { name, sex, type, detail } = req.body;
    const institution = admin.institution_id;

    let avatar = 1;

    if (type === 'Cachorro') {
      avatar = 3;
    }
    if (type === 'Gato') {
      avatar = 4;
    }

    const newAnimal = await Animal.create({
      name,
      sex,
      type,
      detail,
      user_id: req.userId,
      institution_id: institution,
      avatar_id: avatar,
    });

    return res.json(newAnimal);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      sex: Yup.string(),
      type: Yup.string(),
      detail: Yup.string(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Erro de validação' });
    }

    const { id } = req.params;

    const admin = await Admin.findOne({ where: { user_id: req.userId } });

    if (!admin) {
      return res.status(401).json({ error: 'Não autorizado.' });
    }
    const animal = await Animal.findByPk(id);

    if (!(admin.institution_id === animal.institution_id)) {
      return res.status(401).json({ error: 'Não autorizado.' });
    }

    await animal.update(req.body);

    return res.json(animal);
  }

  async delete(req, res) {
    const { id } = req.params;

    const animal = await Animal.findByPk(id);
    if (!animal) {
      return res.status(401).json({ error: 'Animal não encontrado' });
    }

    const isAdmin = await Admin.findOne({ where: { user_id: req.userId } });

    if (!(animal.institution_id === isAdmin.institution_id)) {
      return res
        .status(401)
        .json({ error: 'Somente os administradores podem deletar' });
    }

    await animal.destroy();

    return res.json({ message: 'O registro do animal foi excluido.' });
  }
}

export default new AnimalController();
